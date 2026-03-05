

function _(element)
{
    return document.getElementById(element);
}

function fetch_data(parent_element, child_element, type)
{
    fetch('/get_data?type='+type+'&parent_value='+parent_element.value+'').then(function(response){
        return response.json();
    }).then(function(responseData){
        var html = '';
        if(type == 'load_state')
        {
            html = '<option value="">Select State</option>';
        }
        if(type == 'load_city')
        {
            html = '<option value="">Select City</option>';
        }
        for(var count = 0; count < responseData.length; count++)
        {
            html += '<option value="'+responseData[count]+'">'+responseData[count]+'</option>';
        }
        child_element.innerHTML = html;
    });
}
_('country').onchange = function(){
    fetch_data(_('country'), _('city'), 'load_city');
};
